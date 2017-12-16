package team3;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

import org.apache.beam.runners.dataflow.DataflowRunner;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.coders.BigEndianIntegerCoder;
import org.apache.beam.sdk.coders.KvCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.io.jdbc.JdbcIO;
import org.apache.commons.dbcp2.datasources.*;

import com.mysql.jdbc.PreparedStatement;



public class pipetest1 {
	
	static ArrayList<KV<String, Integer>> ws = new ArrayList<KV<String,Integer>>();
	static ArrayList<KV<String, Integer>> rankings = new ArrayList<KV<String,Integer>>();
	static ArrayList<KV<String, String[]>> calMatches = new ArrayList<KV<String,String[]>>();
	static Integer setrank = -1;

	public static void main(String[] args) {
		PipelineOptions options = PipelineOptionsFactory.create();
		Pipeline p = Pipeline.create(options);
		
		PCollection<KV<String, Integer>> totalScores = p.apply(JdbcIO.<KV<String, Integer>>read()
		         .withDataSourceConfiguration(JdbcIO.DataSourceConfiguration.create(
		                 "com.mysql.jdbc.Driver", "jdbc:mysql://largescale-instance.cvux8fdwpgcr.us-east-1.rds.amazonaws.com/TicTacToeDB")
		                 .withUsername("LargeScaleGroup")
		                 .withPassword("LargeScale2017"))
		                 .withQuery("SELECT username, gamesWon FROM user")
		                 .withCoder(KvCoder.of(StringUtf8Coder.of(), BigEndianIntegerCoder.of()))
		                 .withRowMapper(new JdbcIO.RowMapper<KV<String, Integer>>() {
		                    public KV<String, Integer> mapRow(ResultSet resultSet) throws Exception {
		                    return KV.of(resultSet.getString(1), resultSet.getInt(2));
		                 }
		              })
		          );
		
		
		
		totalScores.apply(ParDo.of(new DoFn<KV<String, Integer>,Void>() {
		      @ProcessElement
		      public void processElement(ProcessContext c)  {
		        ws.add(c.element());
		      }
		    }));
		
		p.run();
		
//d		for(KV<String,Integer> kv : ws){
//d			System.out.println(kv.getKey()+": "+kv.getValue());
//d		}
		
		
		System.out.println();
		KV<String,Integer> temp;
		for(int i = 0; i< ws.size(); i++){
			for(int j = i+1;j<ws.size();j++){
				if(ws.get(i).getValue()<ws.get(j).getValue()){
					temp = ws.get(i);
					ws.set(i,ws.get(j));
					ws.set(j,temp);
				}
			}
		}
		
//d		for(KV<String,Integer> kv : ws){
//d			System.out.println(kv.getKey()+": "+kv.getValue());
//d		}
//d		System.out.println();
		
		Integer rank = 1;
		String key;
		for(int i = 0; i < ws.size(); i++){
			key = ws.get(i).getKey();
			if(i==0){
				rankings.add(KV.of(key,rank));
			}
			else{
				if(ws.get(i-1).getValue() != ws.get(i).getValue()){
					rank++;
				}
				rankings.add(KV.of(key,rank));
			}
		}
		
		totalScores.apply(ParDo.of(new DoFn<KV<String, Integer>,KV<String,Integer>>() {
			@ProcessElement
		      public void processElement(ProcessContext c)  {
				for (KV<String, Integer> kv: rankings){
//d					System.out.println("Checking if "+kv.getKey()+" is equal to "+c.element().getKey());
					if(kv.getKey().equals(c.element().getKey())){
//d						System.out.println("Yes equal, setting "+c.element().getKey()+" to "+ kv.getValue());
						c.output(KV.of(c.element().getKey(), kv.getValue()));
						break;
					}
				}
		      }
			
		}
		))
		.apply(JdbcIO.<KV<String, Integer>>write()
				.withDataSourceConfiguration(JdbcIO.DataSourceConfiguration.create(
						"com.mysql.jdbc.Driver", "jdbc:mysql://largescale-instance.cvux8fdwpgcr.us-east-1.rds.amazonaws.com/TicTacToeDB")
				.withUsername("LargeScaleGroup")
		        .withPassword("LargeScale2017"))
				.withStatement("UPDATE rankings SET rank=? WHERE username=?")
				.withPreparedStatementSetter(new JdbcIO.PreparedStatementSetter<KV<String, Integer>>() {
					   @Override
					    public void setParameters(KV<String, Integer> element, java.sql.PreparedStatement query)
								throws SQLException {
									query.setString(2, element.getKey());
									query.setInt(1, element.getValue());
//d									System.out.println(element.getKey()+ " "+ element.getValue());
						}
				})
				);
		
		p.run();
		
		for(int i = 0;i< rankings.size(); i++){
			if (i==0){
				String[] m = {rankings.get(i+1).getKey(),rankings.get(i+2).getKey(),rankings.get(i+3).getKey()};
				calMatches.add(KV.of(rankings.get(i).getKey(),m));
			}
			else if (i == rankings.size()-2){
				String[] m = {rankings.get(i-2).getKey(),rankings.get(i-1).getKey(),rankings.get(i+1).getKey()};
				calMatches.add(KV.of(rankings.get(i).getKey(),m));
			}
			else if(i == rankings.size()-1){
				String[] m = {rankings.get(i-3).getKey(),rankings.get(i-2).getKey(),rankings.get(i-1).getKey()};
				calMatches.add(KV.of(rankings.get(i).getKey(),m));
			}
			else{
				String[] m = {rankings.get(i-1).getKey(),rankings.get(i+1).getKey(),rankings.get(i+2).getKey()};
				calMatches.add(KV.of(rankings.get(i).getKey(),m));
			}
		}
		
//		System.out.println();
//		for(KV<String,String[]> kv : calMatches){
//			System.out.println(kv.getKey()+": "+kv.getValue()[0]+", "+kv.getValue()[1]+", "+kv.getValue()[2]);
//		}
		
		totalScores.apply(ParDo.of(new DoFn<KV<String, Integer>,KV<String,String[]>>() {
			@ProcessElement
		      public void processElement(ProcessContext c)  {
				for (KV<String,String[]> kv: calMatches){
//d					System.out.println("Checking if "+kv.getKey()+" is equal to "+c.element().getKey());
					if(kv.getKey().equals(c.element().getKey())){
//d						System.out.println("Yes equal, setting "+c.element().getKey()+" to "+ kv.getValue());
						c.output(KV.of(c.element().getKey(), kv.getValue()));
						break;
					}
				}
		      }
			
		}
		))
		.apply(JdbcIO.<KV<String, String[]>>write()
				.withDataSourceConfiguration(JdbcIO.DataSourceConfiguration.create(
						"com.mysql.jdbc.Driver", "jdbc:mysql://largescale-instance.cvux8fdwpgcr.us-east-1.rds.amazonaws.com/TicTacToeDB")
				.withUsername("LargeScaleGroup")
		        .withPassword("LargeScale2017"))
				.withStatement("UPDATE matches SET match1=?, match2=?,match3=? WHERE username=?")
				.withPreparedStatementSetter(new JdbcIO.PreparedStatementSetter<KV<String, String[]>>() {
					   @Override
					    public void setParameters(KV<String, String[]> element, java.sql.PreparedStatement query)
								throws SQLException {
									query.setString(1, element.getValue()[0]);
									query.setString(2, element.getValue()[1]);
									query.setString(3, element.getValue()[2]);
									query.setString(4, element.getKey());
									System.out.println(element.getKey()+ " "+element.getValue()[0]+", "+element.getValue()[1]+", "+element.getValue()[2]);
						}
				})
				);
		p.run();
			
	}
			

		
}




